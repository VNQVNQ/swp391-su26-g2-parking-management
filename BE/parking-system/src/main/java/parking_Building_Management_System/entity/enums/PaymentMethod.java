package parking_Building_Management_System.entity.enums;

public enum PaymentMethod {
    CASH("Cash"),
    INTERNAL("Internal"),
    MONTHLY_PASS("Monthly_Pass");

    private final String displayName;

    PaymentMethod(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}

