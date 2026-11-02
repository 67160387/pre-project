# CLO Requirements Checklist

รูปแบบส่ง: src/, frontend/, openapi.yaml, coverage-report.md, clo-requirements-checklist.md และ package.json วิธีติดตั้งอยู่ src/README.md

| CLO | ข้อกำหนด | หลักฐาน | สถานะ |
|---|---|---|---|
| CLO8 | รวมโค้ด Phase 1–2 และ Microservices | src/gateway.js, src/microservices/, src/reports/live-results.json | 30 checks ผ่าน |
| CLO8 | Swagger ตรงโค้ดจริง | openapi.yaml, src/routes/, src/docs.js | 10 business operations พร้อม health/spec |
| CLO8 | Test Coverage baseline | coverage-report.md, src/tests/, src/reports/ | รันใหม่ 38 tests ผ่าน |
| CLO8 | DB สัมพันธ์ 3 ตารางและ constraints | src/schema.sql, src/seed.sql, src/db.js | FK/UNIQUE/CHECK/RESTRICT ผ่านจริง |
| CLO8 | Retry/Timeout/Fallback | src/services/external-api.js, src/reports/live-results.json | 3 attempts และ fallback ผ่าน |
| W13 | 3 บริการ, diagram, communication, resilience | src/microservices-design.md | มีเอกสารและ process จริง |
| CLO6 | Frontend เรียก ≥3 API รวม GET/เขียนข้อมูล | frontend/app.js | GET games/publishers/categories และ POST/PUT/DELETE |
| CLO6 | Validation, Loading, Error | frontend/index.html, frontend/app.js | Browser ผ่านในชุดเดิม โค้ด frontend ไม่เปลี่ยน |
| CLO7 | Demo สด 3–4 นาที + Q&A 2–3 นาที | ระบบที่รันได้และโค้ดใน src/ | ผู้เรียนยังต้องนำเสนอจริง |

Phase 3 มี Final Integration 5 คะแนน, Frontend 10 คะแนน, Defense 5 คะแนน ตามเอกสารอาจารย์ ไม่รับรองคะแนนที่จะได้รับและยังไม่ได้ส่ง Classroom ทดสอบด้วย MySQL จริง แต่ไม่ได้รัน Docker Engine ในสภาพแวดล้อมทดสอบนี้


## Login update — 2026-11-01
- Added single-admin login and logout; credentials hashed with scrypt in local .env.
- Removed Swagger navigation link; /api-docs remains accessible after login.
- Authentication wrapper protects launched gateway and monolith. Inner app exports remain available for isolated unit testing.
- Auth tests: src/tests/auth.test.js. Updated OpenAPI includes cookie authentication and auth routes.
