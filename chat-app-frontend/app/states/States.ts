import { atom } from "jotai";
import { Friend } from "../pages/chatAreas/page";

export const findFriendAtom = atom<boolean>(false);
export const friendsRequestsAtom = atom<boolean>(false);
export const allFriendsAtom = atom<boolean>(false);
export const friendsCountsAtom = atom<number>(0);
export const selectedFriendAtom = atom<Friend | null>(null);
export const friendsAtom = atom<Friend[]>([]);