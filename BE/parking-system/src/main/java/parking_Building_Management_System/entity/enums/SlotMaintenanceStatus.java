package parking_Building_Management_System.entity.enums;

public enum SlotMaintenanceStatus {
    AVAILABLE("Available"),
    MAINTENANCE("Maintenance");

    private final String displayName;

    SlotMaintenanceStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}

