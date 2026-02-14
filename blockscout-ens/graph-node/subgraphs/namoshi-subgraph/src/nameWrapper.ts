import { BigInt, Bytes, ens } from "@graphprotocol/graph-ts";
import {
  NameWrapped as NameWrappedEvent,
  NameUnwrapped as NameUnwrappedEvent,
  FusesSet as FusesSetEvent,
  ExpiryExtended as ExpiryExtendedEvent,
  TransferSingle as TransferSingleEvent,
} from "../generated/NameWrapper/NameWrapper";
import {
  Domain,
  WrappedDomain,
  Account,
  NameWrapped,
  NameUnwrapped,
  FusesSet,
  ExpiryExtended,
  WrappedTransfer,
} from "../generated/schema";
import {
  createEventID,
  EMPTY_ADDRESS,
} from "./utils";

export function handleNameWrapped(event: NameWrappedEvent): void {
  let node = event.params.node.toHexString();
  let domain = Domain.load(node);
  
  if (domain === null) {
    return;
  }

  let account = new Account(event.params.owner.toHex());
  account.save();

  let wrappedDomain = new WrappedDomain(node);
  wrappedDomain.domain = domain.id;
  wrappedDomain.owner = account.id;
  wrappedDomain.fuses = event.params.fuses.toI32();  // Convert to i32
  wrappedDomain.expiryDate = event.params.expiry;
  
  // Try to decode the name from bytes
  let nameBytes = event.params.name;
  if (nameBytes.length > 0) {
    wrappedDomain.name = nameBytes.toString();
  }
  
  wrappedDomain.save();

  domain.wrappedOwner = account.id;
  domain.save();

  let domainEvent = new NameWrapped(createEventID(event));
  domainEvent.domain = domain.id;
  domainEvent.blockNumber = event.block.number.toI32();
  domainEvent.transactionID = event.transaction.hash;
  domainEvent.name = wrappedDomain.name;
  domainEvent.fuses = event.params.fuses.toI32();  // Convert to i32
  domainEvent.owner = account.id;
  domainEvent.expiryDate = event.params.expiry;
  domainEvent.save();
}

export function handleNameUnwrapped(event: NameUnwrappedEvent): void {
  let node = event.params.node.toHexString();
  let domain = Domain.load(node);
  
  if (domain === null) {
    return;
  }

  let account = new Account(event.params.owner.toHex());
  account.save();

  domain.wrappedOwner = null;
  domain.save();

  let domainEvent = new NameUnwrapped(createEventID(event));
  domainEvent.domain = domain.id;
  domainEvent.blockNumber = event.block.number.toI32();
  domainEvent.transactionID = event.transaction.hash;
  domainEvent.owner = account.id;
  domainEvent.save();
}

export function handleFusesSet(event: FusesSetEvent): void {
  let node = event.params.node.toHexString();
  let wrappedDomain = WrappedDomain.load(node);
  
  if (wrappedDomain === null) {
    return;
  }

  wrappedDomain.fuses = event.params.fuses.toI32();  // Convert to i32
  wrappedDomain.save();

  let domain = Domain.load(node);
  if (domain === null) {
    return;
  }

  let domainEvent = new FusesSet(createEventID(event));
  domainEvent.domain = domain.id;
  domainEvent.blockNumber = event.block.number.toI32();
  domainEvent.transactionID = event.transaction.hash;
  domainEvent.fuses = event.params.fuses.toI32();  // Convert to i32
  domainEvent.save();
}

export function handleExpiryExtended(event: ExpiryExtendedEvent): void {
  let node = event.params.node.toHexString();
  let wrappedDomain = WrappedDomain.load(node);
  
  if (wrappedDomain === null) {
    return;
  }

  wrappedDomain.expiryDate = event.params.expiry;
  wrappedDomain.save();

  let domain = Domain.load(node);
  if (domain !== null) {
    domain.expiryDate = event.params.expiry;
    domain.save();

    let domainEvent = new ExpiryExtended(createEventID(event));
    domainEvent.domain = domain.id;
    domainEvent.blockNumber = event.block.number.toI32();
    domainEvent.transactionID = event.transaction.hash;
    domainEvent.expiryDate = event.params.expiry;
    domainEvent.save();
  }
}

export function handleTransferSingle(event: TransferSingleEvent): void {
  let node = "0x" + event.params.id.toHexString().slice(2).padStart(64, "0");
  let domain = Domain.load(node);
  
  if (domain === null) {
    return;
  }

  let account = new Account(event.params.to.toHex());
  account.save();

  let wrappedDomain = WrappedDomain.load(node);
  if (wrappedDomain !== null) {
    wrappedDomain.owner = account.id;
    wrappedDomain.save();
  }

  domain.wrappedOwner = account.id;
  domain.save();

  let domainEvent = new WrappedTransfer(createEventID(event));
  domainEvent.domain = domain.id;
  domainEvent.blockNumber = event.block.number.toI32();
  domainEvent.transactionID = event.transaction.hash;
  domainEvent.owner = account.id;
  domainEvent.save();
}