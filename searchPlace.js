const express = require('express');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const router = express.Router();

// city.json 파일 로드
const cityData = JSON.parse(fs.readFileSync('./data/city.json', 'utf-8'));

// CSV 파일 경로 설정
const filePath = path.join(__dirname, './data/petfriendlyPlaces.csv');

// 문화시설 검색 엔드포인트
router.post('/', (req, res) => {
  const { city, district } = req.body;

  // 입력값 디버깅
  console.log("City:", city);
  console.log("District:", district);

  // 공백 제거 및 대소문자 문제 처리
  const trimmedCity = city.trim();
  const trimmedDistrict = district.trim();

  // 시와 구가 city.json에 있는지 확인
  if (!cityData[trimmedCity] || !cityData[trimmedCity].includes(trimmedDistrict)) {
    return res.status(400).json({ message: '잘못된 입력 형식입니다. 올바른 시/구를 입력하세요.' });
  }

  let results = [];

  // CSV 파일 읽기
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => {
      if (
        (data.CTGRY_TWO_NM === '반려동반여행' || data.CTGRY_TWO_NM === '반려문화시설') &&
        data.RDNMADR_NM.includes(trimmedCity) &&
        data.RDNMADR_NM.includes(trimmedDistrict)
      ) {
        results.push(data);
      }
    })
    .on('end', () => {
      if (results.length === 0) {
        return res.status(400).json({ success: false, message: "해당 지역에 시설이 없습니다." });
      }

      // 결과가 7개 이상일 때 랜덤으로 7개 선택
      if (results.length > 7) {
        results = results.sort(() => 0.5 - Math.random()).slice(0, 7);
      }
      
      res.json({ success: true, data: results });
    })
    .on('error', (err) => {
      console.error('CSV 파일 읽기 중 오류 발생:', err);
      res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    });
});

module.exports = router;
