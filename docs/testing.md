# Testing

## Running Tests

To run the unit tests:

```bash
pnpm test:unit
```

To run the end-to-end tests:

```bash
pnpm test:e2e
```

To run all tests:

```bash
pnpm test
```

## Known Issues

### Hanging Process Issue

When running unit tests, you may see a message like:

```
close timed out after 1000ms
Tests closed successfully but something prevents Vite server from exiting
```

This is a known issue with Vite-based SvelteKit projects where the test runner doesn't properly clean up all resources, causing the Node.js process to hang. This does not affect the actual test results - all tests are still running and passing correctly.

#### Workarounds

1. **Ignore the hanging process message**: The tests are still running correctly and passing. You can safely ignore the hanging process message.

2. **Use the force exit option**: Run tests with a force exit:

   ```bash
   pnpm test:unit:force
   ```

3. **Reduce test timeout**: The hanging process timeout has been reduced to 1 second to minimize the delay.

## Test Structure

- Unit tests are located in `tests/unit/`
- Contract tests are located in `tests/contract/`
- End-to-end tests are located in `tests/e2e/`

## Test Environment

Tests run in a Node.js environment with mocked browser APIs where necessary.
