import functools


def web_authenticated(method):
    @functools.wraps(method)
    def wrapper(self, *args, **kwargs):
        if not self.current_user:
            self.response(401, 'Authentication required.')
            return
        return method(self, *args, **kwargs)
    return wrapper
