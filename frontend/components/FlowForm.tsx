'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import type { Flow } from '@/types/flow';

type FlowFormProduct = {
  id: string;
  title: string;
  price: string;
};

type FlowFormValues = {
  title: string;
  productId: string;
  slug?: string;
};

type FlowFormProps = {
  products: FlowFormProduct[];
  onSubmit: (payload: FlowFormValues) => Promise<Flow>;
};

const FlowForm = ({ products, onSubmit }: FlowFormProps) => {
  const { toast } = useToast();
  const [createdFlow, setCreatedFlow] = useState<Flow | null>(null);

  const defaultProductId = useMemo(() => products[0]?.id ?? '', [products]);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    setError,
    clearErrors,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FlowFormValues>({
    defaultValues: {
      title: '',
      productId: defaultProductId,
      slug: '',
    },
  });

  useEffect(() => {
    register('productId', {
      required: 'Mahsulot tanlang.',
    });
  }, [register]);

  const selectedProductId = watch('productId');

  useEffect(() => {
    if (!products.length) {
      setValue('productId', '');
      return;
    }
    const exists = products.some((product) => product.id === selectedProductId);
    if (!exists) {
      setValue('productId', defaultProductId);
    }
  }, [defaultProductId, products, selectedProductId, setValue]);

  const handleCopy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({
        title: 'Nusxa olindi',
        description: `${label} buferga nusxalandi.`,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Nusxa olishda xatolik yuz berdi.';
      toast({
        title: 'Xatolik',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const onSubmitHandler = handleSubmit(async (values) => {
    try {
      clearErrors();
      const payload: FlowFormValues = {
        title: values.title.trim(),
        productId: values.productId,
        slug: values.slug?.trim() ? values.slug.trim() : undefined,
      };
      if (!payload.productId) {
        setError('productId', {
          type: 'manual',
          message: 'Mahsulot tanlang.',
        });
        return;
      }
      const flow = await onSubmit(payload);
      setCreatedFlow(flow);
      toast({
        title: 'Oqim yaratildi',
        description: 'Tracking havolasi tayyor, endi trafikka ulashing.',
      });
      reset({
        title: '',
        productId: payload.productId,
        slug: '',
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Oqim yaratishda xatolik yuz berdi.';
      setError('root', {
        type: 'server',
        message,
      });
    }
  });

  const rootError = errors.root?.message;

  return (
    <div className="space-y-6">
      <form
        onSubmit={onSubmitHandler}
        className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Yangi oqim yaratish</h3>
          <p className="mt-1 text-sm text-slate-500">
            Tasdiqlangan mahsulotni tanlang, oqim nomi va (ixtiyoriy) qisqa slug kiriting.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="flow-title" className="text-sm font-medium text-slate-700">
              Oqim nomi
            </label>
            <Input
              id="flow-title"
              placeholder="Masalan, Instagram CPA oqimi"
              {...register('title', {
                required: 'Oqim nomi majburiy.',
                minLength: { value: 3, message: 'Kamida 3 ta belgi kiriting.' },
                maxLength: { value: 150, message: '150 belgidan oshmasligi kerak.' },
              })}
            />
            {errors.title ? (
              <p className="text-xs text-red-600">{errors.title.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="flow-product" className="text-sm font-medium text-slate-700">
              Mahsulot
            </label>
            <Select
              id="flow-product"
              value={selectedProductId}
              onChange={(event) => setValue('productId', event.target.value)}
            >
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.title} ·{' '}
                  {new Intl.NumberFormat('uz-UZ', {
                    style: 'currency',
                    currency: 'UZS',
                    maximumFractionDigits: 0,
                  }).format(Number(product.price))}
                </option>
              ))}
            </Select>
            {errors.productId ? (
              <p className="text-xs text-red-600">{errors.productId.message}</p>
            ) : null}
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="flow-slug" className="text-sm font-medium text-slate-700">
            Qisqa slug (ixtiyoriy)
          </label>
          <Input
            id="flow-slug"
            placeholder="masalan: instagram-yanvar"
            {...register('slug', {
              pattern: {
                value: /^[a-z0-9-]{3,32}$/i,
                message: '3-32 belgi: lotin harflari, raqam va chiziqcha.',
              },
            })}
          />
          <p className="text-xs text-slate-500">
            Agar slug kiritmasangiz, avtomatik ravishda yaratiladi.
          </p>
          {errors.slug ? <p className="text-xs text-red-600">{errors.slug.message}</p> : null}
        </div>

        {rootError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {rootError}
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-3">
          <Button type="submit" disabled={isSubmitting || !products.length}>
            {isSubmitting ? 'Yaratilmoqda...' : 'Oqim yaratish'}
          </Button>
        </div>
      </form>

      {createdFlow ? (
        <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <h4 className="text-lg font-semibold text-emerald-800">Oqim tayyor!</h4>
          <p className="mt-1 text-sm text-emerald-700">
            Quyidagi tracking havolani trafik manbalarida ishlating. Hisobotlar avtomatik
            hisoblanadi.
          </p>

          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <dt className="font-medium text-emerald-900">Tracking havola</dt>
              <dd className="flex items-center gap-3">
                <code className="rounded bg-white px-3 py-1.5 text-xs text-emerald-800 shadow-sm">
                  {createdFlow.trackingUrl}
                </code>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy(createdFlow.trackingUrl, 'Tracking havola')}
                >
                  Nusxalash
                </Button>
              </dd>
            </div>

            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <dt className="font-medium text-emerald-900">Landing manzili</dt>
              <dd className="flex items-center gap-3">
                <code className="rounded bg-white px-3 py-1.5 text-xs text-emerald-800 shadow-sm">
                  {createdFlow.url}
                </code>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy(createdFlow.url, 'Landing URL')}
                >
                  Nusxalash
                </Button>
              </dd>
            </div>
          </dl>
        </section>
      ) : null}
    </div>
  );
};

export type { FlowFormProps, FlowFormProduct, FlowFormValues };
export default FlowForm;
