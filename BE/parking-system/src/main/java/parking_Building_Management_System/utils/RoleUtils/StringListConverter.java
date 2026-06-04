package parking_Building_Management_System.utils.RoleUtils;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Converter
public class StringListConverter implements AttributeConverter<List<String>, String> {
    private static final ObjectMapper objectMapper = new ObjectMapper();

    public String convertToDatabaseColumn(List<String> attribute) {
        if (attribute == null) {
            return "[]";
        } else {
            try {
                return objectMapper.writeValueAsString(attribute);
            } catch (JsonProcessingException e) {
                throw new IllegalArgumentException("Error converting list to JSON", e);
            }
        }
    }

    public List<String> convertToEntityAttribute(String dbData) {
        if (dbData != null && !dbData.isEmpty() && !dbData.equals("[]")) {
            try {
                return objectMapper.readValue(dbData, new TypeReference<List<String>>() {});
            } catch (IOException e) {
                throw new IllegalArgumentException("Error reading JSON", e);
            }
        } else {
            return new ArrayList<>();
        }
    }
}
