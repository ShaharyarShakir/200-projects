package memberships

import "strings"

const (
	RoleOwner      = "OWNER"
	RoleAdmin      = "ADMIN"
	RoleInstructor = "INSTRUCTOR"
	RoleStudent    = "STUDENT"
)

func CanManageAcademy(role string) bool {
	normalized := strings.ToUpper(role)
	return normalized == RoleOwner || normalized == RoleAdmin
}

func CanManageCourses(role string) bool {
	normalized := strings.ToUpper(role)
	return normalized == RoleOwner ||
		normalized == RoleAdmin ||
		normalized == RoleInstructor
}
