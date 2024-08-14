const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: 'http://localhost:3000', // 특정 도메인만 허용 (예: 프론트엔드가 실행되는 도메인)
  credentials: true, // 쿠키 및 인증 정보 전송을 허용하려면 사용
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 카카오 OAuth 2.0 처리 엔드포인트
app.post('/oauth/kakao', async (req, res) => {
  const clientId = process.env.KAKAO_REST_API_KEY;
  const redirectUri = 'http://localhost:3000/oauth'; // 백엔드의 리디렉션 URI
  const code = req.query.code; // 프론트엔드에서 전달받은 인가 코드

  if (!code) {
    console.error("인가 코드가 없습니다.");
    return res.status(400).json({ success: false, message: "인가 코드가 없습니다." });
  }

  console.log("인가 코드:", code); // 인가 코드 출력

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

    // 사용자 정보를 클라이언트에 반환하거나, DB에 저장하는 로직 추가 가능
    res.json({
      success: true,
      user_id: userInfo.id,
      nickname: userInfo.kakao_account.profile.nickname,
      profile_image_url: userInfo.kakao_account.profile.profile_image_url,
      email: userInfo.kakao_account.email,
    });
  } catch (error) {
    console.error('카카오 OAuth 처리 중 오류 발생:', error);
    res.status(500).json({
      success: false,
      message: '카카오 OAuth 처리 중 오류 발생',
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
