-- V4__add_booking_user_id.sql
-- Thêm cột user_id cho bảng bookings để ghi nhận người đặt chỗ kể cả khi đặt cho xe người quen (xe nhập tay không gắn vào tài khoản)

ALTER TABLE public.bookings
    ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES public.users(user_id);

-- Cập nhật user_id từ chủ xe đối với các booking cũ
UPDATE public.bookings b
SET user_id = v.user_id
FROM public.vehicles v
WHERE b.vehicle_id = v.id AND v.user_id IS NOT NULL AND b.user_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
