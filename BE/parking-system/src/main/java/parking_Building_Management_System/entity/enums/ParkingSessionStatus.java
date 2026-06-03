package parking_Building_Management_System.entity.enums;

public enum ParkingSessionStatus {
    ACTIVE("Active"),
    COMPLETED("Completed"),
    OVERSTAY("Overstay");

    private final String displayName;

    ParkingSessionStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}

