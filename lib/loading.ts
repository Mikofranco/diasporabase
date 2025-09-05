import NProgress from 'nprogress';

export const startLoading = () => NProgress.start();
export const stopLoading = () => NProgress.done();