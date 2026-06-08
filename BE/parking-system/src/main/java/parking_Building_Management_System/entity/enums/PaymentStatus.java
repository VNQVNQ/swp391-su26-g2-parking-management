package parking_Building_Management_System.entity.enums;

public enum PaymentStatus {
    UNPAID("Unpaid"),
    PAID("Paid"),
    PENDING("Pending");

    private final String displayName;

    PaymentStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}

