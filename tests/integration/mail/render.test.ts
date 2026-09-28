import { renderMailTemplate } from '../../../src/mail/render.js';
import { teardownTestConnections } from '../../setup/teardown.js';

describe('Mail rendering', () => {
  afterAll(async () => {
    await teardownTestConnections();
  });

  it('renders welcome template with typed data', async () => {
    const { html, text } = await renderMailTemplate('welcome', {
      name: 'Ada',
      verificationUrl: 'https://example.com/verify',
    });

    expect(html).toContain('Ada');
    expect(html).toContain('https://example.com/verify');
    expect(text).toContain('Ada');
  });
});
