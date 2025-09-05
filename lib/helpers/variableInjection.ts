export class VariableInjector {
    private variableMap = new Map<string, string>();

    addVariable(variableKey: string, variableValue: string){
        this.variableMap.set(variableKey, variableValue)
    }

    exportVariableMap() {
        return JSON.stringify(Object.fromEntries(this.variableMap))
    }
}