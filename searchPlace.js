const express = require('express');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const router = express.Router();

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

  let results = [];

  // CSV 파일 읽기
  fs.createReadStream(filePath)
    .pipe(csv({
      headers: ['FCLTY_NM', 'CTGRY_ONE_NM', 'CTGRY_TWO_NM', 'CTGRY_THREE_NM', 'CTPRVN_NM', 'SIGNGU_NM', 'LEGALDONG_NM', 'LI_NM', 'LNBR_NO', 'ROAD_NM', 'BULD_NO', 'LC_LA', 'LC_LO', 'ZIP_NO', 'RDNMADR_NM', 'LNM_ADDR', 'TEL_NO', 'HMPG_URL', 'RSTDE_GUID_CN', 'OPER_TIME', 'PARKNG_POSBL_AT', 'UTILIIZA_PRC_CN', 'PET_POSBL_AT', 'PET_INFO_CN', 'ENTRN_POSBL_PET_SIZE_VALUE', 'PET_LMTT_MTR_CN', 'IN_PLACE_ACP_POSBL_AT', 'OUT_PLACE_ACP_POSBL_AT', 'FCLTY_INFO_DC', 'PET_ACP_ADIT_CHRGE_VALUE', 'LAST_UPDT_DE']
    }))
    .on('data', (data) => {
      if (
        (data.CTGRY_TWO_NM === '반려동반여행' || data.CTGRY_TWO_NM === '반려문화시설') &&
        data.RDNMADR_NM.includes(trimmedCity) &&
        data.RDNMADR_NM.includes(trimmedDistrict)
      ) {
        results.push({
          name: data.FCLTY_NM,
          address: data.RDNMADR_NM
        });
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

// 문화시설 상세 정보 검색 엔드포인트
router.get('/:placeName', (req, res) => {
  const placeName = req.params.placeName.trim();

  let placeFound = false;
  let placeData = null;

  fs.createReadStream(filePath)
    .pipe(csv({
      headers: ['FCLTY_NM', 'CTGRY_ONE_NM', 'CTGRY_TWO_NM', 'CTGRY_THREE_NM', 'CTPRVN_NM', 'SIGNGU_NM', 'LEGALDONG_NM', 'LI_NM', 'LNBR_NO', 'ROAD_NM', 'BULD_NO', 'LC_LA', 'LC_LO', 'ZIP_NO', 'RDNMADR_NM', 'LNM_ADDR', 'TEL_NO', 'HMPG_URL', 'RSTDE_GUID_CN', 'OPER_TIME', 'PARKNG_POSBL_AT', 'UTILIIZA_PRC_CN', 'PET_POSBL_AT', 'PET_INFO_CN', 'ENTRN_POSBL_PET_SIZE_VALUE', 'PET_LMTT_MTR_CN', 'IN_PLACE_ACP_POSBL_AT', 'OUT_PLACE_ACP_POSBL_AT', 'FCLTY_INFO_DC', 'PET_ACP_ADIT_CHRGE_VALUE', 'LAST_UPDT_DE']
    }))
    .on('data', (data) => {
      if (data.FCLTY_NM === placeName) {
        placeFound = true;
        placeData = {
          name: data.FCLTY_NM,
          type: data.CTGRY_THREE_NM,
          address: data.RDNMADR_NM,
          phone: data.TEL_NO,
          restDay: data.RSTDE_GUID_CN,
          operationTime: data.OPER_TIME
        };
      }
    })
    .on('end', () => {
      if (placeFound) {
        res.json({ success: true, data: placeData });
      } else {
        res.status(404).json({ success: false, message: "해당 시설을 찾을 수 없습니다." });
      }
    })
    .on('error', (err) => {
      console.error('CSV 파일 읽기 중 오류 발생:', err);
      res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    });
});

module.exports = router;
