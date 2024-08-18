const express = require('express');
const axios = require('axios');

const router = express.Router();

router.post('/', async (req, res) => {
  const { accessToken } = req.body; // 프론트엔드에서 액세스 토큰을 받습니다.

  if (!accessToken) {
    return res.status(400).json({ success: false, message: "액세스 토큰이 없습니다." });
  }

  try {
    // 카카오 로그아웃 API 요청
    const logoutResponse = await axios.post(
      `https://kapi.kakao.com/v1/user/logout`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (logoutResponse.status === 200) {
      res.json({ success: true, message: "성공적으로 로그아웃 되었습니다." });
    } else {
      res.status(500).json({ success: false, message: "카카오 로그아웃 실패" });
    }
  } catch (error) {
    console.error('로그아웃 중 오류 발생:', error);
    res.status(500).json({ success: false, message: "로그아웃 중 오류 발생" });
  }
});

module.exports = router;
