package parking_Building_Management_System.entity.enums;

public enum PaymentStatus {
    UNPAID("Unpaid"),
    PAID("Paid"),
    REFUNDED("Refunded"),
    FAILED("Failed");

    private final String displayName;

    PaymentStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}

