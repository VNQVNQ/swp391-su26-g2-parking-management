package parking_Building_Management_System.entity.enums;

public enum NotificationType {
    OVERSTAY_ALERT("Overstay Alert"),
    EXCEPTION_PENDING("Exception Pending"),
    BOOKING_EXPIRED("Booking Expired"),
    UNPAID_SESSION("Unpaid Session");

    private final String displayName;

    NotificationType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}

