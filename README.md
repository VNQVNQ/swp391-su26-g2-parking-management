
<img width="1400" height="551" alt="image" src="https://github.com/user-attachments/assets/8f5c637b-5eb4-4ad0-b71d-bef41c4d1504" />
<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:00b894,100:00cec9&height=200&section=header&text=Parking%20BMS&fontSize=60&fontColor=ffffff&animation=fadeIn&fontAlignY=35&desc=Parking%20Building%20Management%20System&descAlignY=55&descSize=20&descColor=d0ffe8" width="100%"/>

<br/>

<p>
  <img src="https://img.shields.io/badge/Topic-SU26SWP07-00b894?style=for-the-badge&logo=academia&logoColor=white"/>
  <img src="https://img.shields.io/badge/Semester-Summer%202026-00cec9?style=for-the-badge&logo=googlecalendar&logoColor=white"/>
  <img src="https://img.shields.io/badge/FPT%20University-HCMC-e17055?style=for-the-badge&logo=graduationcap&logoColor=white"/>
</p>

<p>
  <img src="https://img.shields.io/badge/Java-Spring%20Boot-6db33f?style=flat-square&logo=springboot&logoColor=white"/>
  <img src="https://img.shields.io/badge/React-Vite-61dafb?style=flat-square&logo=react&logoColor=white"/>
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql&logoColor=white"/>
  <img src="https://img.shields.io/badge/Redis-Cache-dc382d?style=flat-square&logo=redis&logoColor=white"/>
  <img src="https://img.shields.io/badge/JWT-Security-000000?style=flat-square&logo=jsonwebtokens&logoColor=white"/>
</p>

</div>

---

## 📌 Mô tả dự án

**Parking Building Management System (Parking BMS)** là hệ thống số hóa toàn bộ quy trình vận hành bãi đỗ xe nhiều tầng tại Việt Nam, thay thế các thao tác thủ công bằng nền tảng phần mềm tích hợp.

### 🔴 Vấn đề thực tế
| Vấn đề | Tác động |
|--------|----------|
| Check-in thủ công → ùn tắc cổng | Tốn thời gian, mất trải nghiệm khách |
| Dữ liệu slot không chính xác | Nhân viên gán xe vào slot đã có xe |
| Sai lệch doanh thu giữa các ca | Không đối soát được, dễ thất thu |
| Không có quy trình xử lý ngoại lệ | Mất vé / quá giờ / sai zone giải quyết tùy hứng |

### ✅ Phạm vi hệ thống (In Scope)
- Quản lý **slot theo tầng, zone, loại xe** (Motorbike / Car / Truck)
- **Xe vào**: nhập biển số → kiểm tra nợ → gán slot → tạo session
- **Xe ra**: tra cứu session → tính phí theo BR-01 → ghi nhận thanh toán
- **Cấu hình giá** linh hoạt theo loại xe, zone, khung giờ cao điểm
- **Dashboard real-time**: tỉ lệ lấp đầy theo tầng/zone
- **Xử lý ngoại lệ**: mất vé, quá giờ, sai zone, nợ phí (cần PARKING_MANAGER approve)
- **Báo cáo PARKING_MANAGER**: doanh thu, utilization %, giờ cao điểm
- **Đặt chỗ trước** (optional): giữ slot theo loại xe & thời gian

---

## 👥 Thành viên nhóm

| # | Họ và tên | MSSV | Vai trò | Branch phụ trách |
|:-:|-----------|:----:|---------|-----------------|
| 1 | **Võ Nhật Quang** | SE196584 | 🔱 Team Leader · Backend Dev |
| 2 | **Nguyễn Phước Sanh** | SE181668 | ⚙️ Backend Dev |
| 3 | **Trần Hữu Trọng Nhân** | SE196231 | ⚙️ Backend Dev |
| 4 | **Nguyễn Lê Nhật Vinh** | SE193661 | 🎨 Frontend Dev |
| 5 | **Nguyễn Quốc Hưng** | SE180315 | 🎨 Frontend Dev |

---

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│          React + Vite  ·  Tailwind CSS  ·  Axios            │
│    PARKING_STAFF UI (entry/exit)  │  PARKING_MANAGER UI (report/config)     │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API (JSON)
┌────────────────────────▼────────────────────────────────────┐
│                      API GATEWAY LAYER                       │
│              Spring Boot · Spring Security · JWT             │
│  /api/floors  /api/zones  /api/slots  /api/sessions         │
│  /api/payments  /api/reports  /api/exceptions               │
└──────────┬──────────────────────────┬───────────────────────┘
           │                          │
┌──────────▼──────────┐   ┌───────────▼──────────────────────┐
│     PostgreSQL 16   │   │           Redis                   │
│  floors · zones     │   │  JWT blacklist · Session cache    │
│  parking_slots      │   │  Rate limiting                    │
│  parking_sessions   │   └──────────────────────────────────┘
│  payments           │
│  exceptions · ...   │
└─────────────────────┘
```

---

## 🔧 Công nghệ sử dụng

### Backend
| Layer | Công nghệ | Version |
|-------|-----------|:-------:|
| Framework | Spring Boot | 3.x |
| Database | PostgreSQL | 16 |
| ORM | Spring Data JPA / Hibernate | — |
| Auth | Spring Security + JWT | — |
| Cache | Redis | 7.x |
| Migration | Flyway | — |
| API Docs | Swagger / OpenAPI 3 | — |
| Build | Maven | 3.x |

### Frontend
| Layer | Công nghệ | Version |
|-------|-----------|:-------:|
| Framework | React + Vite | 18 / 5 |
| Styling | Tailwind CSS | 3.x |
| HTTP Client | Axios | — |
| Charts | Recharts | — |
| State | React Context / Zustand | — |

### DevOps & Công cụ
| Mục | Công cụ |
|-----|---------|
| Version Control | Git + GitHub |
| API Test | Postman |
| Prototype | v0.dev / Lovable.dev |
| Task Tracking | GitHub Projects |

--

## ⚙️ Business Rules cốt lõi

| ID | Loại | Mô tả |
|:--:|------|-------|
| **BR-01** | Calculational | Phí = `ceil((exitTime − entryTime) / 60)` × giá/giờ; áp dụng `minimum_fee` nếu < 1 giờ |
| **BR-02** | Behavioral | PARKING_STAFF **không được** tự free slot → phải tạo ExceptionRecord → PARKING_MANAGER approve |
| **BR-03** | Behavioral | Xe có session **chưa thanh toán** → chặn tạo session mới đến khi trả nợ |
| **BR-04** | Temporal | Session > 24h không exit → auto-flag `OVERSTAY`; áp dụng phí phạt; notify PARKING_MANAGER |
| **BR-05** | Temporal | Booking slot chỉ giữ **30 phút** sau giờ hẹn; hết thời gian → slot tự về `FREE` |

> ⚠️ Tất cả Business Rules được enforce tại **Service layer** — không chỉ validate ở UI.

---

## ▶️ Hướng dẫn chạy dự án

### Yêu cầu môi trường
- Java 17+
- Node.js 18+

### Backend

```bash
# 1. Clone repo
git clone https://github.com/VNQVNQ/swp391-su26-g2-parking-management.git
cd swp391-su26-g2-parking-management/BE/parking-system

# 2. Khởi động PostgreSQL + Redis (Yêu cầu cài đặt và cấu hình PostgreSQL, Redis cục bộ)

# 3. Cấu hình DB trong application-dev.yml
# spring.datasource.url=jdbc:postgresql://localhost:5432/parking_bms

# 4. Chạy ứng dụng
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# API:      http://localhost:8080
# Swagger:  http://localhost:8080/swagger-ui.html
```

### Frontend

```bash
cd ../../FE
npm install
npm run dev

# Chạy tại: http://localhost:5173
```

---

## 🌿 Git Workflow

```
main          ← Code sạch, chỉ Leader merge từ develop (protected branch)
  └── develop ← Branch làm việc chính, tất cả feature PR về đây
        ├── feature/BE-floor-zone-slot
        ├── feature/BE-parking-session
        ├── feature/BE-payment-report
        ├── feature/FE-PARKING_STAFF-ui
        └── feature/FE-PARKING_MANAGER-ui
```

**Quy tắc commit:**
```bash
feat:     Thêm tính năng mới
fix:      Sửa bug
chore:    Config, dependencies, refactor nhỏ
docs:     Cập nhật tài liệu
test:     Thêm unit test
```

**Quy trình làm việc:**
```bash
git checkout develop && git pull origin develop
git checkout -b feature/BE-ten-tinh-nang
# ... code, commit thường xuyên ...
git push origin feature/BE-ten-tinh-nang
# → Tạo Pull Request → assign reviewer → merge vào develop
```

> 🔒 `main` được bảo vệ: bắt buộc qua PR, cần ít nhất 1 approval từ Leader.

---

## 📡 API Endpoints

| Method | Endpoint | Mô tả | Role |
|:------:|----------|-------|:----:|
| `GET` | `/api/floors` | Danh sách tầng | All |
| `POST` | `/api/floors` | Tạo tầng mới | PARKING_MANAGER |
| `GET` | `/api/zones?floorId=` | Zone theo tầng | All |
| `GET` | `/api/slots/available?floorId=&vehicleType=` | Slot trống | PARKING_STAFF |
| `POST` | `/api/slots/bulk` | Tạo slot hàng loạt | PARKING_MANAGER |
| `POST` | `/api/sessions/entry` | Xe vào | PARKING_STAFF |
| `POST` | `/api/sessions/exit/{id}` | Xe ra | PARKING_STAFF |
| `GET` | `/api/sessions/active` | Session đang chạy | PARKING_STAFF/PARKING_MANAGER |
| `GET` | `/api/reports/revenue` | Báo cáo doanh thu | PARKING_MANAGER |
| `POST` | `/api/exceptions` | Tạo exception record | PARKING_STAFF |
| `PUT` | `/api/exceptions/{id}/approve` | Duyệt exception | PARKING_MANAGER |

> 📖 Xem đầy đủ tại Swagger UI sau khi chạy backend.

---

## 📎 Tài liệu liên quan

- 📄 [Business Rules Catalog (50 BRs)](./docs/BR_Catalog.docx)
- 🗃️ [Entity-Relationship Diagram](./docs/ERD.png)
- 🎨 [Prototype v0.dev](#) ← (https://v0-translate-website-to-english-kohl.vercel.app/entry)
- 📬 [Postman Collection](#) ← *export và đính kèm*

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:00b894,100:00cec9&height=100&section=footer" width="100%"/>

<p>
  <sub>Made with ☕ by Group 2 · SWP391 Summer 2026 · FPT University HCMC</sub>
</p>

</div>
