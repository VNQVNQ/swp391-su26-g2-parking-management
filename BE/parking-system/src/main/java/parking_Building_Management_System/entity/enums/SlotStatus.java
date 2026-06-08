package parking_Building_Management_System.entity.enums;

public enum SlotStatus {
    FREE("Free"),
    OCCUPIED("Occupied"),
    RESERVED("Reserved"),
    MAINTENANCE("Maintenance");

    private final String displayName;

    SlotStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}

