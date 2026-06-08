package parking_Building_Management_System.entity.enums;

public enum VehicleType {
    MOTORBIKE("Motorbike"),
    CAR("Car"),
    TRUCK("Truck");

    private final String displayName;

    VehicleType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}

