# วิธีรัน Phase 3

ใช้ Node.js 22+ เปิด Terminal ที่โฟลเดอร์หลักซึ่งมี package.json:

```powershell
npm install
npm run env:setup
docker compose --env-file .env -f src/docker-compose.yml up -d --wait db
npm run db:setup
npm start
```

ต้องเปิด Docker Desktop และรอ Engine พร้อมก่อน หรือใช้ MySQL ที่มีอยู่แล้ว โดยตั้ง DB_HOST, DB_PORT, DB_USER, DB_PASSWORD และ DB_NAME ใน .env ให้ตรงกับฐานข้อมูล boardgame_db และบัญชีของตน

เปิด http://localhost:3000 และ http://localhost:3000/api-docs/ ระบบรัน Gateway :3000, Game :4001, Catalog :4002 และ Enrichment :4003

ทดสอบซ้ำด้วย npm run test:coverage, npm run verify และ npm run postman:test โดยสองคำสั่งหลังต้องเปิดระบบไว้และมีอินเทอร์เน็ตสำหรับ Wikipedia

ไฟล์ .env, node_modules และ package-lock.json สร้างภายหลังติดตั้ง ไม่อยู่ใน ZIP ส่งงาน db:setup คืน seed ID 1–3 จึงไม่ควรใช้ทุกครั้งที่เปิด

โค้ดชุดนี้ทดสอบกับ MySQL 8.4.13 จริงและ dependencies ที่ติดตั้งไว้ ไม่ได้ทดสอบ Docker Engine มี login ผู้ดูแลหนึ่งบัญชี แต่ไม่มี RBAC และ bind localhost สำหรับการเรียน ไม่ใช่ระบบ production

สคริปต์นำเสนอและภาพหน้าจอเก็บแยกในชุดงานเดิม ไม่ต้องแนบใน ZIP นี้


## เข้าสู่ระบบ (อัปเดต 1 พฤศจิกายน 2026)
หลังตั้งค่า .env ให้รัน `npm run auth:setup` ก่อน `npm start` ระบบจะแสดงชื่อผู้ใช้ admin และรหัสผ่านสุ่มครั้งเดียว โปรดเก็บรหัสผ่านไว้ส่วนตัว ไม่ใส่ใน GitHub หรือรายงาน บัญชีเก็บเฉพาะ salt และ scrypt hash ใน .env
เปิด /login แล้วเข้าสู่ระบบเพื่อจัดการเกม มีปุ่มออกจากระบบแทนลิงก์ Swagger หน้า /api-docs ยังใช้งานได้หลังเข้าสู่ระบบตามโจทย์อาจารย์
เซสชันเป็นคุกกี้ HttpOnly, SameSite=Strict หมดอายุใน 8 ชั่วโมง และยกเลิกเมื่อออกจากระบบหรือรีสตาร์ตเซิร์ฟเวอร์ ล็อกอินผิด 10 ครั้งต่อ IP จะพัก 15 นาที
ใช้บัญชีผู้ดูแลเดียว ไม่มีสมัครสมาชิกหรือแบ่งสิทธิ์ บริการย่อยผูกกับ 127.0.0.1 และต้องเข้าผ่าน gateway สำหรับการใช้งานจากเว็บ หากนำขึ้นออนไลน์ต้องใช้ HTTPS ตั้ง COOKIE_SECURE=true และปิดการเข้าถึงบริการย่อยจากภายนอก
สำหรับ Postman ให้ POST /api/auth/login ด้วย JSON {"username":"admin","password":"รหัสผ่านของคุณ"} บน baseUrl เดียวกับ collection ก่อน คุกกี้จะถูกใช้กับคำขอต่อไป อย่าบันทึกรหัสผ่านจริงใน collection

การรัน npm run verify: ตั้ง AUTH_TEST_PASSWORD เป็นรหัสผ่านล็อกอินใน environment ของเครื่องก่อน แล้วลบค่านี้เมื่อทดสอบเสร็จ คำสั่ง npm run postman:test ใช้ AUTH_TEST_PASSWORD เพื่อล็อกอินให้อัตโนมัติ

อัปเดต: npm run postman:test จะล็อกอินให้อัตโนมัติด้วย AUTH_TEST_PASSWORD แล้วรัน collection และบันทึกเฉพาะสถิติที่ไม่มีรหัสผ่านหรือคุกกี้ หากใช้ Postman GUI ให้ตั้ง environment variables username และ password แบบ local ไม่ export ค่าเหล่านี้
