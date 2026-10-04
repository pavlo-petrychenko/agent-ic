export const CREATE_WORKSPACE_MUTATION = `
  mutation CreateWorkspace($input: CreateWorkspaceInput!) {
    createWorkspace(input: $input) { workspace { id name memberCount } role }
  }
`;

export const INVITE_LINK_QUERY = '{ inviteLink { url role joinedCount } }';

export const RESET_INVITE_LINK_MUTATION = 'mutation { resetInviteLink { url } }';

export const MEMBERS_QUERY = '{ members { totalCount edges { node { email role } } } }';

export const ME_MEMBERSHIPS_QUERY = '{ me { memberships { workspace { id } role } } }';

export const INVITE_INFO_QUERY = `
  query InviteInfo($token: String!) {
    inviteInfo(token: $token) { workspaceName memberCount role }
  }
`;

export const SIGN_UP_WITH_INVITE_MUTATION = `
  mutation SignUp($input: SignUpInput!) {
    signUp(input: $input) { email }
  }
`;
