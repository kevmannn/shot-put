import { sep, join, resolve, relative } from 'path';
import _ from 'lodash';
import osHomedir from 'os-homedir';

const home = osHomedir();

export const parseHome = pathTo => {
  const startPath = pathTo.split(sep).slice(0, 3).join(sep);
  return startPath === home ? pathTo : join(home, pathTo);
}

export const watcherIsActive = watcher => {
  return _.isFunction(watcher.getWatched) && _.keys(watcher.getWatched()).length;
}

export const defaultSorcePath = join(home, resolve(home, relative(home, `${sep}desktop`)));
