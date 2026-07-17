
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


## ▶️ Hướng dẫn chạy dự án

### Yêu cầu môi trường
- Java 17+
- Node.js 18+

### Backend

```bash
# 1. Clone repo
git clone https://github.com/VNQVNQ/swp391-su26-g2-parking-management.git
cd swp391-su26-g2-parking-management/BE/parking-system

# 2. Khởi động PostgreSQL (Yêu cầu cài đặt và cấu hình PostgreSQL)

# 3. Cấu hình DB trong application-dev.yml
# spring.datasource.url=jdbc:postgresql://localhost:5432/parking_bms

# 4. Chạy ứng dụng
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# API:      http://localhost:8080
# Swagger:  http://localhost:8080/swagger-ui.html
```

### Frontend

```bash
cd ../../FE/smart-parking
npm install
npm run dev

# Chạy tại: http://localhost:5173
```

## 📡 API Endpoints
> 📖 Xem đầy đủ tại Swagger UI sau khi chạy backend.


---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:00b894,100:00cec9&height=100&section=footer" width="100%"/>

<p>
  <sub>Made with ☕ by Group 2 · SWP391 Summer 2026 · FPT University HCMC</sub>
</p>

</div>
