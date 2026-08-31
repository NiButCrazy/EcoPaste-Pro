import { startDrag } from "@crabnebula/tauri-plugin-drag";
import { useAsyncEffect, useReactive } from "ahooks";
import { Flex } from "antd";
import clsx from "clsx";
import { type FC, useRef } from "react";
import {
  fullName,
  icon,
  type Metadata,
  metadata,
} from "tauri-plugin-fs-pro-api";
import LocalImage from "@/components/LocalImage";
import { isImage, isLinux } from "@/utils/is";
import { getSaveIconPath } from "@/utils/path";

interface FileProps {
  path: string;
  count: number;
}

interface State extends Partial<Metadata> {
  icon?: string;
}

const File: FC<FileProps> = (props) => {
  const { path, count } = props;

  const state = useReactive<State>({});
  const fileRef = useRef<HTMLSpanElement>(null);

  useAsyncEffect(async () => {
    try {
      const data = await metadata(path, { omitSize: true });

      Object.assign(state, data);

      if (isLinux) return;

      state.icon = await icon(path, { savePath: getSaveIconPath(), size: 256 });
    } catch {
      state.fullName = await fullName(path);
    }
  }, [path]);

  const renderContent = () => {
    if (state.isExist && count === 1 && isImage(path)) {
      return (
        <div className="inline-flex">
          <Flex align="center" vertical>
            <LocalImage
              className="item-image max-h-21.5"
              src={path}
              title={path}
            />
            <span className="truncate opacity-[0.5]">{state.fullName}</span>
          </Flex>
        </div>
      );
    }

    return (
      <div
        className={clsx("h-7", { "py-0.5": count > 1 })}
        draggable
        onDragStart={(e) => {
          fileRef.current?.classList.add("start-drag");
          startDrag({ icon: state.icon ?? path, item: [path] });
          e.preventDefault();
        }}
      >
        <Flex align="center" className="h-full" gap={4}>
          {state.icon && <LocalImage className="h-full" src={state.icon} />}

          <span
            className={clsx("item-file truncate", {
              "text-danger line-through": !state.isExist,
            })}
            ref={fileRef}
            title={path}
          >
            {state.fullName}
          </span>
        </Flex>
      </div>
    );
  };

  return renderContent();
};

export default File;
