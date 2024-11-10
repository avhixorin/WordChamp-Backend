class ApiError extends Error {
    statusCode: number;

    constructor(statusCode: number,message: string) {
        super(message);
        this.statusCode = statusCode; 
        this.name = this.constructor.name;
    }
}


const errorInstance = new ApiError(404,"Not Found");
console.error(errorInstance.message); 
console.error(errorInstance.statusCode); 

export default ApiError
