export type DhcpStatic = {
  // id: number;
  // subnet_id: number;
  mac_address: string;
  ipv4_address: string;
  ipv6_address: string;
  hostname: string;
  lease_time: string;
  is_active: boolean;
  pingable: boolean;
};

export const emptyStatic: DhcpStatic = {
  mac_address: "",
  ipv4_address: "",
  ipv6_address: "",
  hostname: "",
  lease_time: "",
  is_active: false,
  pingable: false,
};