package dto

// APIResponse is the standard response wrapper
type APIResponse struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   *string     `json:"error,omitempty"`
}

// Success returns a successful response
func Success(data interface{}) APIResponse {
	return APIResponse{
		Code:    200,
		Message: "Success",
		Data:    data,
	}
}

// Created returns a 201 created response
func Created(data interface{}) APIResponse {
	return APIResponse{
		Code:    201,
		Message: "Created",
		Data:    data,
	}
}

// Error returns an error response
func Error(code int, message string) APIResponse {
	return APIResponse{
		Code:    code,
		Message: message,
		Error:   &message,
	}
}

// ErrorWithDetails returns an error response with details
func ErrorWithDetails(code int, message string, details string) APIResponse {
	return APIResponse{
		Code:    code,
		Message: message,
		Error:   &details,
	}
}
