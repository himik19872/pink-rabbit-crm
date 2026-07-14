import React, { useRef, useEffect, useState } from 'react';
import { Modal, Button, Radio, InputNumber, Space, Typography } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import JsBarcode from 'jsbarcode';
import { QRCode } from 'antd';

const { Text } = Typography;

interface CageLabel {
  id: number;
  address: string;
  qrData: string;
  barcodeData: string;
  capacity: number;
}

interface Props {
  open: boolean;
  cages: CageLabel[];
  onClose: () => void;
}

type LabelType = 'qr' | 'barcode' | 'both';
type LabelSize = 'small' | 'medium' | 'large';

const LABEL_SIZES: Record<LabelSize, { width: number; cols: number; className: string }> = {
  small:   { width: 120, cols: 4, className: 'label-small' },
  medium:  { width: 160, cols: 3, className: 'label-medium' },
  large:   { width: 220, cols: 2, className: 'label-large' },
};

const BarcodeLabel: React.FC<{ data: string; size: number }> = ({ data, size }) => {
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, data, {
          format: 'CODE128',
          width: 1.5,
          height: Math.round(size * 0.3),
          displayValue: false,
          margin: 2,
          background: '#ffffff',
          lineColor: '#000000',
        });
      } catch (e) {
        console.warn('Barcode generation failed for:', data, e);
      }
    }
  }, [data, size]);

  return <svg ref={barcodeRef} />;
};

const LabelPrinter: React.FC<Props> = ({ open, cages, onClose }) => {
  const [labelType, setLabelType] = useState<LabelType>('both');
  const [labelSize, setLabelSize] = useState<LabelSize>('medium');
  const [copies, setCopies] = useState<number>(1);

  if (cages.length === 0) {
    return (
      <Modal title="🖨️ Печать этикеток" open={open} onCancel={onClose} footer={null}>
        <Text type="secondary">Выберите клетки для печати</Text>
      </Modal>
    );
  }

  const size = LABEL_SIZES[labelSize];
  const qrSize = Math.round(size.width * 0.55);
  const barcodeWidth = Math.round(size.width * 0.85);

  const allLabels: CageLabel[] = [];
  for (let i = 0; i < copies; i++) {
    allLabels.push(...cages);
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      title="🖨️ Печать этикеток"
      open={open}
      onCancel={onClose}
      width={800}
      footer={
        <Space>
          <Button onClick={onClose}>Отмена</Button>
          <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
            🖨️ Печать ({allLabels.length} шт.)
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {/* Controls */}
        <Space wrap>
          <div>
            <Text style={{ marginRight: 8 }}>Тип:</Text>
            <Radio.Group value={labelType} onChange={e => setLabelType(e.target.value)}>
              <Radio.Button value="qr">QR-код</Radio.Button>
              <Radio.Button value="barcode">Штрих-код</Radio.Button>
              <Radio.Button value="both">Оба</Radio.Button>
            </Radio.Group>
          </div>

          <div>
            <Text style={{ marginRight: 8 }}>Размер:</Text>
            <Radio.Group value={labelSize} onChange={e => setLabelSize(e.target.value)}>
              <Radio.Button value="small">Малый</Radio.Button>
              <Radio.Button value="medium">Средний</Radio.Button>
              <Radio.Button value="large">Крупный</Radio.Button>
            </Radio.Group>
          </div>

          <div>
            <Text style={{ marginRight: 8 }}>Копий:</Text>
            <InputNumber min={1} max={10} value={copies} onChange={v => setCopies(v || 1)} />
          </div>
        </Space>

        {/* Labels grid */}
        <div className={`label-sheet label-sheet--${labelSize}`}>
          {allLabels.map((cage, i) => (
            <div key={`${cage.id}-${i}`} className={`label-item ${size.className}`}>
              <div className="label-content">
                {/* QR code */}
                {(labelType === 'qr' || labelType === 'both') && (
                  <div className="label-qr">
                    <QRCode value={cage.qrData} size={qrSize} bordered={false} />
                  </div>
                )}

                {/* Barcode */}
                {(labelType === 'barcode' || labelType === 'both') && (
                  <div className="label-barcode">
                    <BarcodeLabel data={cage.barcodeData} size={barcodeWidth} />
                  </div>
                )}

                {/* Text */}
                <div className="label-text">
                  <div className="label-address">{cage.address}</div>
                  <div className="label-meta">
                    Вмест: {cage.capacity} | ID: {cage.id}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Space>

      {/* Print-only styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .ant-modal-root, .ant-modal-root * { visibility: visible; }
          .ant-modal-mask { display: none !important; }
          .ant-modal-wrap { position: absolute !important; top: 0 !important; left: 0 !important; }
          .ant-modal { max-width: 100% !important; width: 100% !important; margin: 0 !important; padding: 0 !important; top: 0 !important; }
          .ant-modal-content { box-shadow: none !important; border: none !important; padding: 0 !important; }
          .ant-modal-header, .ant-modal-footer, .ant-space { display: none !important; }
          .label-sheet { margin: 0 !important; padding: 5mm !important; page-break-after: always; }
          .label-item { break-inside: avoid; border: 1px dashed #ccc !important; }
        }
      `}</style>

      <style>{`
        .label-sheet {
          display: grid;
          gap: 8px;
          padding: 8px;
          background: #f5f5f5;
          border-radius: 8px;
        }
        .label-sheet--small  { grid-template-columns: repeat(4, 1fr); }
        .label-sheet--medium { grid-template-columns: repeat(3, 1fr); }
        .label-sheet--large  { grid-template-columns: repeat(2, 1fr); }

        .label-item {
          background: #fff;
          border: 1px solid #d9d9d9;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
        }

        .label-content {
          text-align: center;
          width: 100%;
        }

        .label-qr {
          display: flex;
          justify-content: center;
          margin-bottom: 4px;
        }
        .label-qr canvas { display: block; }

        .label-barcode {
          display: flex;
          justify-content: center;
          margin-bottom: 4px;
          overflow: hidden;
        }

        .label-text {
          line-height: 1.3;
        }
        .label-address {
          font-size: 11px;
          font-weight: 600;
          color: #262626;
          word-break: break-word;
        }
        .label-meta {
          font-size: 9px;
          color: #8c8c8c;
        }
      `}</style>
    </Modal>
  );
};

export default LabelPrinter;
