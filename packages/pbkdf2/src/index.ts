import hmac from '@cryptography/hmac';
import { i2s } from '@cryptography/utils';
import type { HashFunction } from '@cryptography/utils';

export default function pbkdf2(pwd: string, salt: string, iter: number, digest: HashFunction, out: number = 64) {
  const parts = Math.ceil(out / digest.digestLength);
  const round = (out - (parts - 1) * digest.digestLength) / 4;

  const pwdkey = hmac.key(pwd, digest);
  const u = new Uint32Array(digest.digestLength / 4);
  const xor = new Uint32Array(digest.digestLength / 4);
  const dk = new Uint32Array(out / 4);

  let offset = 0;

  for (let i = 1; i <= parts; i += 1) {
    // PRF(P, S || INT(i)) (first iteration)
    u.set(hmac(salt + i2s(i), pwdkey, digest));
    xor.set(u);

    // PRF(P, u_{c-1}) (other iterations)
    for (let j = 2; j <= iter; j += 1) {
      u.set(hmac(u, pwdkey, digest));

      // F(p, s, c, i)
      for (let k = 0; k < xor.length; k++) xor[k] ^= u[k];
    }

    dk.set(i < parts ? xor : xor.subarray(0, round), offset);
    offset += xor.length;
  }

  return dk;
}
