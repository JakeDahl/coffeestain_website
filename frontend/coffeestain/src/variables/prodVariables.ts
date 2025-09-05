export class ProdVariables {
    public cognitoUserPoolId: string;
    public cognitoUserPoolClientId: string;
    public restApiEndpoint: string;

    constructor() {
        this.cognitoUserPoolId = '##_COG_USER_POOL_ID_##';
        this.cognitoUserPoolClientId = '##_COG_USER_POOL_CLIENT_ID_##';
        this.restApiEndpoint = '##_REST_API_ENDPOINT_##';
    }
}

export default ProdVariables;