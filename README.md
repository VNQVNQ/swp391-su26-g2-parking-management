<img width="1400" height="551" alt="image" src="https://github.com/user-attachments/assets/8f5c637b-5eb4-4ad0-b71d-bef41c4d1504" />
# swp391-su26-g2-parking-management
> Topic Code: **SU26SWP07** | Semester: Summer 2026
---
## 📌 Mô tả dự án
Hệ thống quản lý tòa nhà gửi xe (Parking Building Management System) được
xây dựng nhằm số hóa toàn bộ quy trình vận hành bãi đỗ xe nhiều tầng tại
Việt Nam, thay thế các thao tác thủ công bằng nền tảng phần mềm tích hợp.
**Vấn đề giải quyết:**
- Ùn tắc cổng do check-in thủ công chậm
- Dữ liệu slot không chính xác — nhân viên phân bổ slot đã có xe
- Sai lệch doanh thu giữa các ca
- Không có quy trình chuẩn xử lý ngoại lệ (mất vé, quá giờ, sai zone)
**Phạm vi hệ thống (In Scope):**
- Quản lý slot theo tầng, zone, loại xe
- Xe vào: nhập biển số, phân slot, tạo session
- Xe ra: tra cứu session, tính phí, ghi nhận thanh toán
- Cấu hình giá theo loại xe, zone, khung giờ
- Dashboard real-time: tỉ lệ lấp đầy theo tầng/zone
- Xử lý ngoại lệ: mất vé, quá giờ, sai zone, nợ phí
- Báo cáo Manager: doanh thu, tỉ lệ sử dụng, giờ cao điểm
- Đặt trước (optional): giữ slot theo loại xe & thời gian
---
## 👥 Thành viên nhóm
| # | Họ và tên | MSSV | Vai trò |
|---|-----------|------|---------|---------------------|
| 1 | Võ Nhật Quang | SE196584 | Team Leader · Backend Dev |
| 2 | Nguyễn Phước Sanh | SE181668 | Backend Dev | 
| 3 | Trần Hữu Trọng Nhân | [MSSV] | Backend Dev | 
| 4 | Nguyễn Lê Nhật Vinh | SE193661 | Frontend Dev | 
| 5 | Nguyễn Quốc Hưng | SE180315 | Frontend Dev | 
---
## 🔧 Công nghệ sử dụng

### Backend (3 thành viên)
| Layer | Công nghệ |
|-------|-----------|
| Framework | Java Spring Boot |
| Database | PostgreSQL  |
| ORM | Spring Data JPA / Hibernate |
| Auth | Spring Security + JWT |
| API | RESTful API (JSON) |
| Docs | Swagger / OpenAPI 3 |
| Build | Maven |

### Frontend (2 thành viên)
| Layer | Công nghệ |
|-------|-----------|
| Framework | React + Vite |
| Styling | Tailwind CSS |
| HTTP | Axios |
| Charts | Recharts |

### DevOps / Cộng tác
| Mục | Công cụ |
|-----|---------|
| Version control | Git + GitHub |
| Branch strategy | `main` · `develop` · `feature/xxx` |
| Task tracking | GitHub Projects / Jira |
| API test | Postman |
| Prototype | v0.dev / Lovable.dev |
- Docker
- Docker Compose
---

## 🗃️ Cấu trúc thư mục
\`\`\`
parking-bms/
├── backend/                  # Spring Boot project
│   ├── src/
│   │   ├── main/java/com/parkingbms/
│   │   │   ├── controller/   # REST Controllers
│   │   │   ├── service/      # Business Logic
│   │   │   ├── repository/   # JPA Repositories
│   │   │   ├── entity/       # JPA Entities
│   │   │   ├── dto/          # Request/Response DTOs
│   │   │   └── exception/    # Custom Exception Handlers
│   │   └── resources/
│   │       ├── application.yml
│   │       └── db/migration/ # SQL scripts
│   └── pom.xml
├── frontend/                 # React + Vite project
│   ├── src/
│   │   ├── pages/            # Staff / Manager screens
│   │   ├── components/       # Reusable UI components
│   │   ├── services/         # Axios API calls
│   │   └── utils/
│   └── package.json
├── docs/
│   ├── BR_Catalog.docx       # 50 Business Rules
│   ├── ERD.png
│   └── prototype/            # v0 / Lovable screenshots
└── README.md
\`\`\`

---

## 🚦 Main Flow

\`\`\`
[Staff] Nhập biển số + loại xe
    → Hệ thống kiểm tra nợ phí (BR-03)
    → Hệ thống gán slot trống đúng loại xe (BR-13, BR-14)
    → Tạo ParkingSession (entryTime = server timestamp)
    → Slot → Occupied | Dashboard cập nhật real-time

[Staff] Xe ra: quét biển số / sessionID
    → Tra cứu session
    → Tính phí = ceil(duration/60) × rate (BR-01)
    → Ghi nhận thanh toán → Slot → Free

[Manager] Xem Dashboard: slot trống/đầy theo tầng, zone
[Manager] Xem Báo cáo: doanh thu, utilization%, giờ cao điểm
[Staff]   Tạo ExceptionRecord khi: mất vé / quá giờ / sai zone
\`\`\`

---

## ▶️ Hướng dẫn chạy dự án

### Backend
\`\`\`bash
cd backend
# Cập nhật DB config trong src/main/resources/application.yml
./mvnw spring-boot:run
# API chạy tại: http://localhost:8080
# Swagger UI: http://localhost:8080/swagger-ui.html
\`\`\`

### Frontend
\`\`\`bash
cd frontend
npm install
npm run dev
# Chạy tại: http://localhost:5173
\`\`\`

---

## 📎 Tài liệu liên quan

- [Business Rules Catalog (50 BRs)](./docs/BR_Catalog.docx)
- [Entity-Relationship Diagram](./docs/ERD.png)
- [Prototype (v0.dev)](https://v0.dev/...) ← cập nhật link sau khi gen
- [Figma / Lovable Demo](https://lovable.dev/...) ← cập nhật link sau khi gen

---

## 📝 Ghi chú

- Mọi thành viên commit theo nhánh `feature/ten-tinh-nang`, tạo PR về `develop`
- Leader review và merge PR; không merge trực tiếp lên `main`
- Business Rules được enforce ở tầng Service (không chỉ validation UI)
