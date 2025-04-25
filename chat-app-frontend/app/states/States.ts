import { atom } from "jotai";
import { Friend } from "../pages/chatAreas/page";
import { Group } from "../components/GroupChatPage";

const userId = localStorage.getItem("userId")
    ? localStorage.getItem("userId")
    : null;

export const findFriendAtom = atom<boolean>(false);
export const findFriendWithChatAtom = atom<boolean>(true);
export const friendsRequestsAtom = atom<boolean>(false);
export const allFriendsAtom = atom<boolean>(false);
export const groupChatOpenAtom = atom<boolean>(false);
export const friendsCountsAtom = atom<number>(0);
export const selectedFriendAtom = atom<Friend | null>(null);
export const friendsAtom = atom<Friend[]>([]);

export const selectedGroupAtom = atom<Group | null>(null);
export const groupNameAtom = atom<String>("");
export const groupAdminsAtom = atom<String[]>(userId ? [userId] : []);
export const groupMembersAtom = atom<String[]>([]);
export const groupProfileAtom = atom<string>("");
export const isNewGroupWindowAtom = atom<boolean>(false);

