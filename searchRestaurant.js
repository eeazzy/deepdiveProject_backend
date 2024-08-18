const express = require('express');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const router = express.Router();

// CSV 파일 경로 설정
const filePath = path.join(__dirname, './data/restaurants.csv');

// 시/구 확인 및 식당 정보 검색 엔드포인트
router.post('/', (req, res) => {
  const { city, district } = req.body;

  // 입력값 디버깅
  console.log("City:", city);
  console.log("District:", district);

  // 공백 제거 및 대소문자 문제 처리
  const trimmedCity = city.trim();
  const trimmedDistrict = district.trim();

  let results = [];
  let cityFound = false;

  // CSV 파일 읽기
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => {
      const address = data.RSTRNT_ROAD_NM_ADDR.trim().toLowerCase();

      if (address.includes(trimmedCity) && address.includes(trimmedDistrict)) {
        cityFound = true;
        results.push({
          name: data.RSTRNT_NM,
          address: data.RSTRNT_ROAD_NM_ADDR
        });
      }
    })
    .on('end', () => {
      if (!cityFound || results.length === 0) {
        return res.status(400).json({ success: false, message: "해당 조건에 맞는 데이터가 없습니다." });
      }
      res.json({ success: true, data: results });
    })
    .on('error', (err) => {
      console.error('CSV 파일 읽기 중 오류 발생:', err);
      res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    });
});

// 가게 이름을 통해 상세 정보를 검색하는 엔드포인트
router.get('/:restaurantName', (req, res) => {
  const restaurantName = req.params.restaurantName.trim();

  let restaurantFound = false;

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => {
      if (data.RSTRNT_NM.trim() === restaurantName) {
        restaurantFound = true;
        res.json({
          success: true,
          data: {
            restaurantName: data.RSTRNT_NM,
            address: data.RSTRNT_ROAD_NM_ADDR,
            phone: data.RSTRNT_TEL_NO,
            menu: data.SLE_MENU_INFO_DC
          }
        });
      }
    })
    .on('end', () => {
      if (!restaurantFound) {
        res.status(404).json({ success: false, message: "해당 가게를 찾을 수 없습니다." });
      }
    })
    .on('error', (err) => {
      console.error('CSV 파일 읽기 중 오류 발생:', err);
      res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    });
});


module.exports = router;