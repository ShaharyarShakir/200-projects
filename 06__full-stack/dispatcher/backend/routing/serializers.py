from rest_framework import serializers

def validate_coordinate_pair(value):
    if not isinstance(value, (list, tuple)) or len(value) != 2:
        raise serializers.ValidationError("Coordinate must be a list of 2 numbers: [longitude, latitude].")
    lng, lat = value
    if not isinstance(lng, (int, float)) or not isinstance(lat, (int, float)):
        raise serializers.ValidationError("Longitude and Latitude must be numbers.")
    if not (-180 <= lng <= 180):
        raise serializers.ValidationError(f"Invalid longitude: {lng}. Must be between -180 and 180.")
    if not (-90 <= lat <= 90):
        raise serializers.ValidationError(f"Invalid latitude: {lat}. Must be between -90 and 90.")
    return value

class LocationSearchQuerySerializer(serializers.Serializer):
    q = serializers.CharField(required=True, allow_blank=False, min_length=1)

class LocationReverseQuerySerializer(serializers.Serializer):
    lat = serializers.FloatField(required=True, min_value=-90.0, max_value=90.0)
    lng = serializers.FloatField(required=True, min_value=-180.0, max_value=180.0)

class GeocodeRequestSerializer(serializers.Serializer):
    address = serializers.CharField(required=True, allow_blank=False, min_length=1)

class RouteRequestSerializer(serializers.Serializer):
    origin = serializers.ListField(
        child=serializers.FloatField(),
        min_length=2,
        max_length=2,
        required=True,
        validators=[validate_coordinate_pair]
    )
    pickup = serializers.ListField(
        child=serializers.FloatField(),
        min_length=2,
        max_length=2,
        required=True,
        validators=[validate_coordinate_pair]
    )
    dropoff = serializers.ListField(
        child=serializers.FloatField(),
        min_length=2,
        max_length=2,
        required=True,
        validators=[validate_coordinate_pair]
    )


