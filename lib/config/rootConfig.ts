export interface StageConfiguration {
    stageName: string;
    accountId: string;
    region: string;
}


export interface RootConfig {
    serviceName?: string;
    hostedZoneName: string; // Replace with real hosted zone.
    frontEndPath: string;
    stageConfigurations: StageConfiguration[]
}
