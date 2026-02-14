import { BigInt, crypto, Bytes } from "@graphprotocol/graph-ts";
import {
  NameRegistered as NameRegisteredEvent,
  NameRenewed as NameRenewedEvent,
} from "../generated/ETHRegistrarController/ETHRegistrarController";
import {
  Domain,
  Registration,
  Account,
} from "../generated/schema";
import {
  byteArrayFromHex,
  concat,
  createEventID,
  GRACE_PERIOD_SECONDS,
  getRootNodeHash,
  getTldFromIsBTC,
  checkValidLabel,
} from "./utils";

export function handleNameRegisteredByController(event: NameRegisteredEvent): void {
  let name = event.params.name;
  if (!checkValidLabel(name)) {
    return;
  }

  let account = new Account(event.params.owner.toHex());
  account.save();

  let isBTC = event.params.isBTC;
  let label = event.params.label;
  let rootNodeHash = byteArrayFromHex(getRootNodeHash(isBTC));
  let tld = getTldFromIsBTC(isBTC);

  let domainId = crypto.keccak256(concat(rootNodeHash, Bytes.fromByteArray(label))).toHex();
  let domain = Domain.load(domainId);

  if (domain === null) {
    domain = new Domain(domainId);
    domain.createdAt = event.block.timestamp;
    domain.subdomainCount = 0;
    domain.isMigrated = true;
    domain.storedOffchain = false;
    domain.resolvedWithWildcard = false;
  }

  // This is where we get the actual name from the event!
  domain.labelName = name;
  domain.name = name + tld;
  domain.labelhash = label;
  domain.owner = account.id;
  domain.registrant = account.id;
  domain.expiryDate = event.params.expires.plus(GRACE_PERIOD_SECONDS);
  domain.isBTC = isBTC;
  domain.save();

  let registration = Registration.load(label.toHex());
  if (registration === null) {
    registration = new Registration(label.toHex());
    registration.domain = domain.id;
    registration.registrationDate = event.block.timestamp;
  }
  
  registration.labelName = name;
  registration.expiryDate = event.params.expires;
  registration.registrant = account.id;
  registration.cost = event.params.baseCost.plus(event.params.premium);
  registration.save();
}

export function handleNameRenewedByController(event: NameRenewedEvent): void {
  let name = event.params.name;
  if (!checkValidLabel(name)) {
    return;
  }

  let isBTC = event.params.isBTC;
  let label = event.params.label;
  let rootNodeHash = byteArrayFromHex(getRootNodeHash(isBTC));

  let domainId = crypto.keccak256(concat(rootNodeHash, Bytes.fromByteArray(label))).toHex();
  let domain = Domain.load(domainId);

  if (domain === null) {
    return;
  }

  domain.expiryDate = event.params.expires.plus(GRACE_PERIOD_SECONDS);
  domain.save();

  let registration = Registration.load(label.toHex());
  if (registration !== null) {
    registration.expiryDate = event.params.expires;
    registration.save();
  }
}