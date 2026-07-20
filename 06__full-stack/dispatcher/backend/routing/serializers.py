from rest_framework import serializers

def validate_coordinate_pair(value):
    if isinstance(value, dict):
        lat = value.get('lat', value.get('latitude'))
        lng = value.get('lng', value.get('longitude'))
        if lat is None or lng is None:
            raise serializers.ValidationError("Location object must contain 'lat' and 'lng' properties.")
        value = [lng, lat]

    if not isinstance(value, (list, tuple)) or len(value) != 2:
        raise serializers.ValidationError("Coordinate must be a list of 2 numbers [longitude, latitude] or object with {lat, lng}.")
    
    try:
        lng = float(value[0])
        lat = float(value[1])
    except (ValueError, TypeError):
        raise serializers.ValidationError("Longitude and Latitude must be valid numbers.")

    if not (-180 <= lng <= 180):
        raise serializers.ValidationError(f"Invalid longitude: {lng}. Must be between -180 and 180.")
    if not (-90 <= lat <= 90):
        raise serializers.ValidationError(f"Invalid latitude: {lat}. Must be between -90 and 90.")
    return [lng, lat]

class LocationSearchQuerySerializer(serializers.Serializer):
    q = serializers.CharField(required=True, allow_blank=False, min_length=1)

class LocationReverseQuerySerializer(serializers.Serializer):
    lat = serializers.FloatField(required=True, min_value=-90.0, max_value=90.0)
    lng = serializers.FloatField(required=True, min_value=-180.0, max_value=180.0)

class GeocodeRequestSerializer(serializers.Serializer):
    address = serializers.CharField(required=True, allow_blank=False, min_length=1)

class CoordinateField(serializers.Field):
    def to_internal_value(self, data):
        return validate_coordinate_pair(data)

    def to_representation(self, value):
        return value

class RouteRequestSerializer(serializers.Serializer):
    current = CoordinateField(required=False)
    origin = CoordinateField(required=False)
    pickup = CoordinateField(required=True)
    dropoff = CoordinateField(required=True)

    def validate(self, attrs):
        origin_val = attrs.get('current') or attrs.get('origin')
        if not origin_val:
            raise serializers.ValidationError({"current": "Either 'current' or 'origin' coordinate is required."})
        attrs['origin'] = origin_val
        return attrs
