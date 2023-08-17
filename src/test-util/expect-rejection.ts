/* istanbul ignore file */
export async function expectRejection(
    promise: Promise<unknown>,
    rejectionValue: unknown
): Promise<void> {
    try {
        await promise;
        fail(`expected rejection: ${rejectionValue}`);
    } catch (err) {
        expect((err as Error).message).toEqual(rejectionValue);
    }
}
