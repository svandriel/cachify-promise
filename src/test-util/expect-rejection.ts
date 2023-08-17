/* istanbul ignore file */
export async function expectRejection(promise: Promise<any>, rejectionValue: any): Promise<void> {
    try {
        await promise;
        fail(`expected rejection: ${rejectionValue}`);
    } catch (err) {
        expect((err as Error).message).toEqual(rejectionValue);
    }
}
