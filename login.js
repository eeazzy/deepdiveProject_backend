const express = require('express');
const axios = require('axios');

const pool = require('./db');

const router = express.Router();

router.post('/', async (req, res) => {
  const clientId = process.env.KAKAO_REST_API_KEY;
  const redirectUri = 'http://localhost:3000/oauth'; // 백엔드의 리디렉션 URI
  const code = req.query.code; // 프론트엔드에서 전달받은 인가 코드

  if (!code) {
    console.error("인가 코드가 없습니다.");
    return res.status(400).json({ success: false, message: "인가 코드가 없습니다." });
  }

  try {
    // 카카오 서버에 액세스 토큰 요청
    const tokenResponse = await axios.post(
      'https://kauth.kakao.com/oauth/token',
      null,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        params: {
          grant_type: 'authorization_code',
          client_id: clientId,
          redirect_uri: redirectUri,
          code: code,
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    if (!accessToken) {
      throw new Error('액세스 토큰이 없습니다.');
    }

    // 액세스 토큰을 이용해 사용자 정보를 요청
    const userInfoResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const userInfo = userInfoResponse.data;
    console.log('User Info:', userInfo);

    // 사용자 정보를 DB에 저장
    const userId = userInfo.id;
    const nickname = userInfo.kakao_account.profile.nickname;
    const email = userInfo.kakao_account.email || null;
    const profileImageUrl = userInfo.kakao_account.profile.profile_image_url || null;

    const query = `
      INSERT INTO users (id, nickname, email, profile_image_url)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      nickname = VALUES(nickname),
      email = VALUES(email),
      profile_image_url = VALUES(profile_image_url)
    `;

    const [result] = await pool.query(query, [userId, nickname, email, profileImageUrl]);
    console.log('DB 저장 성공:', result);

    res.json({
      success: true,
      user_id: userId,
      nickname: nickname,
      email: email,
    });
  } catch (error) {
    console.error('카카오 OAuth 처리 중 오류 발생:', error);
    res.status(500).json({
      success: false,
      message: '카카오 OAuth 처리 중 오류 발생',
    });
  }
});

module.exports = router;
