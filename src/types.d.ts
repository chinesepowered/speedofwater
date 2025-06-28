import { MongoClient } from 'mongodb';

declare global {
  var _mongoClientPromise: Promise<MongoClient>;
}

declare module 'topojson-client' {
  export function feature(topology: any, object: any): any;
}

declare module 'topojson-types' {
  export type GeometryCollection = any;
} 