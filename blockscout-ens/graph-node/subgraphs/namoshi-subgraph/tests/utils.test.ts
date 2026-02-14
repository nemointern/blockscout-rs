import {
  describe,
  test,
  assert,
} from "matchstick-as/assembly/index"
import { hashByName } from "../src/utils"
import { byteArrayFromHex } from "../src/utils"

describe("Namoshi utils tests", () => {

  test("hashByName works for .btc domains", () => {
    // Test basic btc domain hashing
    assert(byteArrayFromHex('f028fadbfdb11003ef803a8413d568fe74d7332360581486b05297f29aaa1d94').equals(
      hashByName('nemo.btc')
    ))
  })

  test("hashByName works for .citrea domains", () => {
    // Test basic citrea domain hashing
    assert(byteArrayFromHex('f028fadbfdb11003ef803a8413d568fe74d7332360581486b05297f29aaa1d94').equals(
      hashByName('nemo.citrea')
    ))
  })
})
