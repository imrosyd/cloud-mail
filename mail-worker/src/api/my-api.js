import app from '../hono/hono';
import userService from '../service/user-service';
import result from '../model/result';
import userContext from '../security/user-context';
import KvConst from '../const/kv-const';

app.get('/my/loginUserInfo', async (c) => {
	const user = await userService.loginUserInfo(c, userContext.getUserId(c));
	return c.json(result.ok(user));
});

app.put('/my/resetPassword', async (c) => {
	await userService.resetPassword(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok());
});

app.delete('/my/delete', async (c) => {
	await userService.delete(c, userContext.getUserId(c));
	return c.json(result.ok());
});

// Per-user colors for the account list's domain markers, e.g. {"example.com": "#1890ff"}
app.get('/my/domainColors', async (c) => {
	const colors = await c.env.kv.get(KvConst.DOMAIN_COLORS + userContext.getUserId(c), { type: 'json' });
	return c.json(result.ok(colors || {}));
});

app.put('/my/domainColors', async (c) => {
	const body = await c.req.json();
	const colors = {};
	for (const [domain, color] of Object.entries(body?.colors || {}).slice(0, 200)) {
		if (/^[a-z0-9.-]{1,253}$/i.test(domain) && /^#[0-9a-f]{6}$/i.test(color)) {
			colors[domain.toLowerCase()] = color.toLowerCase();
		}
	}
	await c.env.kv.put(KvConst.DOMAIN_COLORS + userContext.getUserId(c), JSON.stringify(colors));
	return c.json(result.ok(colors));
});
