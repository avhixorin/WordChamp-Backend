
class ApiResponse {
    statusCode: number;
    message: string;
    data: object | null; 

    constructor(statusCode: number, message: string, data: object | null = null) {
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
    }
}

export default ApiResponse
