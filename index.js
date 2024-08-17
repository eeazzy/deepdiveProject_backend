const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const loginRouter = require('./login');
const getUserInfoRouter = require('./getUserInfo');
const searchRestaurantRouter = require('./searchRestaurant');
const searcMedicalRouter = require('./searchMedical');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: 'http://localhost:3000', // 특정 도메인만 허용 (예: 프론트엔드가 실행되는 도메인)
  credentials: true, // 쿠키 및 인증 정보 전송을 허용하려면 사용
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/oauth/kakao', loginRouter);
app.use('/api', getUserInfoRouter);
app.use('/search/restaurant', searchRestaurantRouter);
app.use('/search/medical', searcMedicalRouter);

app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
