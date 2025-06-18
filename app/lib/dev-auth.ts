// Dev authentication utilities

export function parseDevSession(cookieHeader: string | null): { isValid: boolean; username?: string } {
  if (!cookieHeader) {
    return { isValid: false };
  }

  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [name, value] = cookie.trim().split('=');
    acc[name] = value;
    return acc;
  }, {} as Record<string, string>);

  const devSession = cookies.dev_session;
  
  if (!devSession) {
    return { isValid: false };
  }

  try {
    const decoded = Buffer.from(devSession, 'base64').toString();
    const [username, timestamp] = decoded.split(':');
    
    // Check if session is less than 24 hours old
    const sessionAge = Date.now() - parseInt(timestamp);
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (sessionAge > maxAge) {
      return { isValid: false };
    }

    return { isValid: true, username };
  } catch {
    return { isValid: false };
  }
}

export function requireDevAuth(request: Request): { username: string } {
  const cookieHeader = request.headers.get("Cookie");
  const session = parseDevSession(cookieHeader);
  
  if (!session.isValid || !session.username) {
    throw new Response("Unauthorized", { 
      status: 401,
      headers: {
        "Location": "/dev-login"
      }
    });
  }

  return { username: session.username };
}