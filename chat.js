const express = require('express');
const axios = require('axios');
const fs = require('fs');
const pool = require('./db');

const router = express.Router();

const BASE_URL = 'http://localhost:3001/search';

// city.json 파일 로드
const cityData = JSON.parse(fs.readFileSync('./data/city.json', 'utf-8'));

// 기본 환영 메시지
const defaultMessage = "안녕하세요! 원하시는 시/자치구를 입력하시면 반려견 동반 가능 식당/병원/문화시설을 찾아드립니다. 3가지 정보를 꼭 포함시켜 입력해 주세요!";

// 새로운 사용자와의 채팅 세션을 시작할 때 기본 메시지를 보냄
router.get('/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
        // 기존 대화 기록 가져오기
        const [chatHistory] = await pool.query(
            'SELECT * FROM chat_history WHERE user_id = ? ORDER BY timestamp ASC',
            [userId]
        );

        // 만약 기록이 없으면 기본 메시지를 추가
        if (chatHistory.length === 0) {
            await pool.query(
                'INSERT INTO chat_history (user_id, message, sender) VALUES (?, ?, ?)',
                [userId, defaultMessage, 'bot']
            );

            chatHistory.push({
                user_id: userId,
                message: defaultMessage,
                sender: 'bot',
                timestamp: new Date()
            });
        }

        // 대화 기록 반환
        res.json({ success: true, chatHistory });

    } catch (error) {
        console.error('Error fetching chat history:', error);
        res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
});

// 사용자가 메시지를 보낼 때 대화 기록에 추가하고 적절한 응답을 생성
router.post('/:userId', async (req, res) => {
    const userId = req.params.userId;
    const { message } = req.body;

    console.log(`Received message from user ${userId}: ${message}`);

    const trimmedMessage = message.trim();

    // 시, 구, 카테고리 추출
    const [city, district, category] = trimmedMessage.split(" ");
    // 시와 구가 city.json에 있는지 확인
    if (!cityData[city] || !cityData[city].includes(district)) {
        await pool.query(
            'INSERT INTO chat_history (user_id, message, sender) VALUES (?, ?, ?)',
            [userId, '잘못된 입력 형식입니다. 올바른 시/구를 입력하세요.', 'bot']
        );

        return res.status(400).json({ message: '잘못된 입력 형식입니다. 올바른 시/구를 입력하세요.' });
    }

    let searchUrl = "";

    switch (category) {
        case "식당":
            searchUrl = `${BASE_URL}/restaurant`;
            break;
        case "병원":
            searchUrl = `${BASE_URL}/medical`;
            break;
        case "문화시설":
            searchUrl = `${BASE_URL}/place`;
            break;
        default:
            await pool.query(
                'INSERT INTO chat_history (user_id, message, sender) VALUES (?, ?, ?)',
                [userId, '잘못된 카테고리입니다. 식당, 병원, 문화시설 중 하나를 선택해 주세요.', 'bot']
            );

            return res.status(400).json({ success: false, message: "잘못된 카테고리입니다. 식당, 병원, 문화시설 중 하나를 선택해 주세요." });
    }

    try {
        const searchResponse = await axios.post(searchUrl, { city, district });
        const results = searchResponse.data;

        // 사용자 메시지와 봇의 응답을 DB에 저장
        await pool.query(
            'INSERT INTO chat_history (user_id, message, sender) VALUES (?, ?, ?)',
            [userId, trimmedMessage, 'user']
        );

        await pool.query(
            'INSERT INTO chat_history (user_id, message, sender) VALUES (?, ?, ?)',
            [userId, JSON.stringify(results.data), 'bot']
        );

        res.json({
            success: true,
            userId,
            messages: [
                { sender: 'user', message: trimmedMessage },
                { sender: 'server', message: results.data }
            ]
        });

    } catch (error) {
        console.error('검색 중 오류 발생:', error);
        res.status(500).json({ success: false, message: "검색 중 오류가 발생했습니다." });
    }
});

// DELETE 요청: 대화 기록을 삭제하고 기본 메시지를 남김
router.delete('/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
        // 기존 대화 기록 삭제
        await pool.query('DELETE FROM chat_history WHERE user_id = ?', [userId]);

        // 기본 메시지 추가
        await pool.query(
            'INSERT INTO chat_history (user_id, message, sender) VALUES (?, ?, ?)',
            [userId, defaultMessage, 'bot']
        );

        res.json({ success: true, message: "대화 기록이 삭제되었습니다." });

    } catch (error) {
        console.error('Error deleting chat history:', error);
        res.status(500).json({ success: false, message: '대화 기록 삭제 중 오류가 발생했습니다.' });
    }
});

module.exports = router;
