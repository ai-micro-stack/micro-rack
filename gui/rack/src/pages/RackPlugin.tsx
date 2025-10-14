import PluginManager from "@/components/PluginManager";

const uploadChannel = "rackPlugin";
const allowedTypes: string[] = ["zip"];

function RackPlugin() {
  const managerTitle = "Rack Plugin Manager";
  return (
    <PluginManager
      channelParam={uploadChannel}
      allowedTypes={allowedTypes}
      managerTitle={managerTitle}
    />
  );
}

export default RackPlugin;
